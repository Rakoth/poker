class CreateGameTypes < ActiveRecord::Migration
  def self.up
    create_table :game_types do |t|
      t.string  :title
      t.integer :max_players
      t.integer :start_stack
      t.decimal :start_cash, :precision => 10, :scale => 2
      t.decimal :additional_cash, :precision => 10, :scale => 2
      t.integer :start_blind
      t.integer :bet_multiplier
      t.integer :change_level_time
      t.integer :time_for_action
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
