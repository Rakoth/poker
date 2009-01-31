class CreateGameTypes < ActiveRecord::Migration
  def self.up
    create_table :game_types do |t|
      t.string  :title
      t.integer :max_players
      t.integer :start_stack
      t.integer :start_cash
      t.float   :additional_cash
      t.integer :start_blind
      t.integer :raise_blind_time
      t.integer :raise_blind_size
      t.string  :template
      t.integer :min_level
      t.integer :max_level

      t.timestamps
    end
  end

  def self.down
    drop_table :game_types
  end
end
