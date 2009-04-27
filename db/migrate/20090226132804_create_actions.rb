class CreateActions < ActiveRecord::Migration
  def self.up
    create_table :actions do |t|
      t.references :game
      t.references :player
      t.string :type
      t.integer :value
			t.boolean :deleted, :default => false
      t.timestamp :created_at
    end
  end

  def self.down
    drop_table :actions
  end
end
